#include <stdint.h>
#include <stdbool.h>
#include "inc/hw_ints.h"
#include "inc/hw_types.h"
#include "inc/hw_memmap.h"
#include "driverlib/adc.h"
#include "driverlib/debug.h"
#include "driverlib/fpu.h"
#include "driverlib/gpio.h"
#include "driverlib/interrupt.h"
#include "driverlib/pin_map.h"
#include "driverlib/sysctl.h"
#include "driverlib/uart.h"
#include "driverlib/rom.h"
#include "driverlib/rom_map.h"

#define LED_RED GPIO_PIN_1
#define LED_BLUE GPIO_PIN_2
#define LED_GREEN GPIO_PIN_3

void
UARTSend(const uint8_t *pui8Buffer, uint32_t ui32Count)
{
    //
    // Loop while there are more characters to send.
    //
    while (ui32Count--)
    {
        //
        // Write the next character to the UART.
        //
        ROM_UARTCharPutNonBlocking(UART0_BASE, *pui8Buffer++);
    }
}

void
UARTRecv(uint8_t *pui8Buffer)
{
    int numChar = 0;
    uint8_t c;

    //
    // Loop until there is NULL terminator
    //
    do
    {
        //
        // Fill buffer with next data received from UART
        //
        c = (uint8_t)ROM_UARTCharGet(UART0_BASE);
        pui8Buffer[numChar++] = c;
    } while (c != '\0');
}

char isSameString(const char *s1, const char *s2)
{
    while (1)
    {
        if (*s1 != *s2)
        {
            return 0;
        }

        if (*s1 == '\0')
        {
            return 1;
        }

        s1++; s2++;
    }
}

int itoa(int value, char *sp, int radix)
{
    char tmp[16];// be careful with the length of the buffer
    char *tp = tmp;
    int i;
    unsigned v;

    int sign = (radix == 10 && value < 0);
    if (sign)
        v = -value;
    else
        v = (unsigned)value;

    while (v || tp == tmp)
    {
        i = v % radix;
        v /= radix; // v/=radix uses less CPU clocks than v=v/radix does
        if (i < 10)
            *tp++ = i+'0';
        else
            *tp++ = i + 'a' - 10;
    }

    int len = tp - tmp;

    if (sign)
    {
        *sp++ = '-';
        len++;
    }

    while (tp > tmp)
        *sp++ = *--tp;

    return len;
}

int
main(void)
{
    uint32_t ui32Value;
    uint8_t recvBuf[32];
    uint8_t sendBuf[32];
    int itoaRet;
    int offset;

    //
    // Zeros buffer
    //
    for (int i=0; i<32; i++)
    {
        recvBuf[i] = 0;
        sendBuf[i] = 0;
    }

    //
    // Set the clocking to run directly from the crystal.
    //
    ROM_SysCtlClockSet(SYSCTL_SYSDIV_1 | SYSCTL_USE_OSC | SYSCTL_OSC_MAIN |
                       SYSCTL_XTAL_16MHZ);

    //
    // Enable the GPIO port that is used for the on-board LED.
    //
    ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_GPIOF);

    //
    // Enable the GPIO pins for the LED (PF2).
    //
    ROM_GPIOPinTypeGPIOOutput(GPIO_PORTF_BASE, GPIO_PIN_2);

    //
    // Enable the UART that is used for communication to computer.
    //
    ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_UART0);
    ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_GPIOA);

    //
    // Set GPIO A0 and A1 as UART pins.
    //
    ROM_GPIOPinConfigure(GPIO_PA0_U0RX);
    ROM_GPIOPinConfigure(GPIO_PA1_U0TX);
    ROM_GPIOPinTypeUART(GPIO_PORTA_BASE, GPIO_PIN_0 | GPIO_PIN_1);

    //
    // Configure the UART for 9600, 8-N-1 operation.
    //
    ROM_UARTConfigSetExpClk(UART0_BASE, ROM_SysCtlClockGet(), 9600,
                            (UART_CONFIG_WLEN_8 | UART_CONFIG_STOP_ONE |
                             UART_CONFIG_PAR_NONE));

    //
    // Enable the ADC that is used for sampling the photoresister
    //
    ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_ADC0);

    //
    // Configures ADC0 sample sequencer 0 to capture the value of channel 0 on
    // processor trigger at the highest priority level.
    //
    ADCSequenceConfigure(ADC0_BASE, 0, ADC_TRIGGER_PROCESSOR, 0);
    ROM_ADCSequenceStepConfigure(ADC0_BASE, 0, 0, (ADC_CTL_IE | ADC_CTL_END |
                                 ADC_CTL_CH0));
    ROM_ADCSequenceEnable(ADC0_BASE, 0);

    //
    // Waits until 'start' is received
    //
    while (!isSameString((const char *)recvBuf, "start"))
    {
        UARTRecv(recvBuf);
    }

    //
    // Loop forever
    //
    while (1)
    {
        //
        // Zeros buffer
        //
        for (int i=0; i<32; i++)
        {
            recvBuf[i] = 0;
            sendBuf[i] = 0;
        }

        //
        // Trigger the ADC to sample
        //
        ROM_ADCProcessorTrigger(ADC0_BASE, 0);

        //
        // Waits until the sample sequence is finished
        //
        while (!ROM_ADCIntStatus(ADC0_BASE, 0, false)) {}

        //
        // Read the value from the ADC
        //
        ROM_ADCSequenceDataGet(ADC0_BASE, 0, &ui32Value);

        //
        // Sends ADC value through UART
        //
        itoaRet = itoa(ui32Value, (char*)sendBuf, 10);
        offset = 4-itoaRet;
        for (int i=0; i<offset; i++)
        {
            sendBuf[3] = sendBuf[2];
            sendBuf[2] = sendBuf[1];
            sendBuf[1] = sendBuf[0];
            sendBuf[0] = (uint8_t)'0';
        }
        UARTSend(sendBuf, 4);

        ROM_GPIOPinWrite(GPIO_PORTF_BASE, LED_BLUE, LED_BLUE);
        ROM_SysCtlDelay(1000000);
        ROM_GPIOPinWrite(GPIO_PORTF_BASE, LED_BLUE, 0);

        //
        // Waits until 'ack' is received
        //
        while(!isSameString((const char *)recvBuf, "ack"))
        {
            UARTRecv(recvBuf);
        }
    }
}

